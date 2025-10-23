'''
Business: Handle game operations - place bet, cashout, get history
Args: event with httpMethod, body (action, user_id, bet_amount, multiplier, etc.)
Returns: HTTP response with game result
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        return handle_game_action(event)
    elif method == 'GET':
        return get_leaderboard(event)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }

def handle_game_action(event: Dict[str, Any]) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    user_id = body_data.get('user_id')
    
    if action == 'place_bet':
        return place_bet(body_data)
    elif action == 'cashout':
        return cashout(body_data)
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'}),
        'isBase64Encoded': False
    }

def place_bet(data: Dict[str, Any]) -> Dict[str, Any]:
    user_id = data.get('user_id')
    bet_amount = data.get('bet_amount')
    
    if not user_id or not bet_amount:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id and bet_amount are required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute('SELECT balance FROM users WHERE id = %s', (user_id,))
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    balance = row[0]
    
    if balance < bet_amount:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Insufficient balance'}),
            'isBase64Encoded': False
        }
    
    cur.execute(
        'UPDATE users SET balance = balance - %s WHERE id = %s RETURNING balance',
        (bet_amount, user_id)
    )
    new_balance = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'balance': new_balance, 'bet_placed': True}),
        'isBase64Encoded': False
    }

def cashout(data: Dict[str, Any]) -> Dict[str, Any]:
    user_id = data.get('user_id')
    bet_amount = data.get('bet_amount')
    multiplier = data.get('multiplier')
    auto_cashout = data.get('auto_cashout')
    
    if not user_id or not bet_amount or not multiplier:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id, bet_amount and multiplier are required'}),
            'isBase64Encoded': False
        }
    
    win_amount = int(bet_amount * multiplier)
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute(
        'UPDATE users SET balance = balance + %s WHERE id = %s RETURNING balance',
        (win_amount, user_id)
    )
    new_balance = cur.fetchone()[0]
    
    cur.execute(
        '''
        INSERT INTO games (user_id, bet_amount, multiplier, win_amount, is_win, auto_cashout)
        VALUES (%s, %s, %s, %s, %s, %s)
        ''',
        (user_id, bet_amount, multiplier, win_amount, True, auto_cashout)
    )
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'balance': new_balance,
            'win_amount': win_amount,
            'multiplier': multiplier
        }),
        'isBase64Encoded': False
    }

def get_leaderboard(event: Dict[str, Any]) -> Dict[str, Any]:
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute(
        '''
        SELECT 
            u.username,
            u.first_name,
            u.balance,
            COALESCE(MAX(g.multiplier), 0) as max_multiplier,
            COALESCE(SUM(CASE WHEN g.is_win THEN g.win_amount ELSE 0 END), 0) as total_wins
        FROM users u
        LEFT JOIN games g ON u.id = g.user_id
        GROUP BY u.id, u.username, u.first_name, u.balance
        ORDER BY total_wins DESC
        LIMIT 10
        '''
    )
    
    leaderboard = []
    for row in cur.fetchall():
        leaderboard.append({
            'name': row[1] or row[0] or 'Anonymous',
            'stars': int(row[4]),
            'multiplier': float(row[3])
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'leaderboard': leaderboard}),
        'isBase64Encoded': False
    }