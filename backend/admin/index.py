'''
Business: Admin panel - view users, update balances, manage settings
Args: event with httpMethod, headers (X-User-Id), body (action, data)
Returns: HTTP response with admin data
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'X-User-Id header required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute('SELECT is_admin FROM users WHERE id = %s', (user_id,))
    row = cur.fetchone()
    
    if not row or not row[0]:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Admin access required'}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    if method == 'GET':
        return get_admin_data(event)
    elif method == 'POST':
        return update_user_balance(event)
    elif method == 'PUT':
        return toggle_admin(event)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }

def get_admin_data(event: Dict[str, Any]) -> Dict[str, Any]:
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        '''
        SELECT 
            id, telegram_id, username, first_name, last_name, 
            balance, is_admin, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 100
        '''
    )
    
    users = []
    for row in cur.fetchall():
        users.append({
            'id': row[0],
            'telegram_id': row[1],
            'username': row[2],
            'first_name': row[3],
            'last_name': row[4],
            'balance': row[5],
            'is_admin': row[6],
            'created_at': row[7].isoformat() if row[7] else None
        })
    
    cur.execute('SELECT COUNT(*) FROM users')
    total_users = cur.fetchone()[0]
    
    cur.execute('SELECT COUNT(*) FROM games')
    total_games = cur.fetchone()[0]
    
    cur.execute('SELECT COALESCE(SUM(win_amount), 0) FROM games WHERE is_win = true')
    total_winnings = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'users': users,
            'stats': {
                'total_users': total_users,
                'total_games': total_games,
                'total_winnings': int(total_winnings)
            }
        }),
        'isBase64Encoded': False
    }

def update_user_balance(event: Dict[str, Any]) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    target_user_id = body_data.get('user_id')
    new_balance = body_data.get('balance')
    
    if not target_user_id or new_balance is None:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id and balance are required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        'UPDATE users SET balance = %s WHERE id = %s RETURNING balance',
        (new_balance, target_user_id)
    )
    updated_balance = cur.fetchone()[0]
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'balance': updated_balance}),
        'isBase64Encoded': False
    }

def toggle_admin(event: Dict[str, Any]) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    target_user_id = body_data.get('user_id')
    is_admin = body_data.get('is_admin')
    
    if not target_user_id or is_admin is None:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id and is_admin are required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        'UPDATE users SET is_admin = %s WHERE id = %s RETURNING is_admin',
        (is_admin, target_user_id)
    )
    updated_admin = cur.fetchone()[0]
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'is_admin': updated_admin}),
        'isBase64Encoded': False
    }
