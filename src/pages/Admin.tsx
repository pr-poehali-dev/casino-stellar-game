import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const ADMIN_API_URL = 'https://functions.poehali.dev/c931e7f2-c5f4-433c-b725-255396157dd5';

interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_games: number;
  total_winnings: number;
}

interface AdminPanelProps {
  userId: number;
}

const Admin = ({ userId }: AdminPanelProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch(ADMIN_API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': userId.toString(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const data = await response.json();
      setUsers(data.users);
      setStats(data.stats);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные админки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (targetUserId: number) => {
    try {
      const response = await fetch(ADMIN_API_URL, {
        method: 'POST',
        headers: {
          'X-User-Id': userId.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: targetUserId,
          balance: parseInt(newBalance)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update balance');
      }

      toast({
        title: 'Успешно',
        description: 'Баланс обновлён'
      });

      setEditingUser(null);
      setNewBalance('');
      fetchAdminData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить баланс',
        variant: 'destructive'
      });
    }
  };

  const toggleAdmin = async (targetUserId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(ADMIN_API_URL, {
        method: 'PUT',
        headers: {
          'X-User-Id': userId.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: targetUserId,
          is_admin: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle admin');
      }

      toast({
        title: 'Успешно',
        description: `Админ права ${!currentStatus ? 'выданы' : 'убраны'}`
      });

      fetchAdminData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить права',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-neon-cyan text-2xl font-montserrat animate-neon-pulse">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted font-roboto">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-montserrat font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-yellow mb-2"
              style={{ textShadow: '0 0 20px hsl(var(--neon-pink))' }}>
            🛠️ АДМИН-ПАНЕЛЬ 🛠️
          </h1>
          <p className="text-neon-cyan text-lg font-montserrat">Управление казино</p>
        </header>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-2 border-neon-pink p-6"
                  style={{ boxShadow: '0 0 15px hsl(var(--neon-pink))' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Всего игроков</p>
                  <p className="text-4xl font-montserrat font-bold text-neon-pink">{stats.total_users}</p>
                </div>
                <Icon name="Users" className="text-neon-pink" size={48} />
              </div>
            </Card>

            <Card className="bg-card border-2 border-neon-cyan p-6"
                  style={{ boxShadow: '0 0 15px hsl(var(--neon-cyan))' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Всего игр</p>
                  <p className="text-4xl font-montserrat font-bold text-neon-cyan">{stats.total_games}</p>
                </div>
                <Icon name="Gamepad2" className="text-neon-cyan" size={48} />
              </div>
            </Card>

            <Card className="bg-card border-2 border-gold p-6"
                  style={{ boxShadow: '0 0 15px hsl(var(--gold))' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Выплачено звёзд</p>
                  <p className="text-4xl font-montserrat font-bold text-gold">{stats.total_winnings}</p>
                </div>
                <Icon name="Star" className="text-gold" size={48} />
              </div>
            </Card>
          </div>
        )}

        <Card className="bg-card border-2 border-neon-purple p-6"
              style={{ boxShadow: '0 0 15px hsl(var(--electric-purple))' }}>
          <h2 className="text-2xl font-montserrat font-bold text-neon-purple mb-6 flex items-center gap-2"
              style={{ textShadow: '0 0 10px hsl(var(--electric-purple))' }}>
            <Icon name="Users" size={28} />
            Управление пользователями
          </h2>

          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-muted/50 p-4 rounded-lg border border-neon-purple/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="font-montserrat font-semibold text-foreground">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">@{user.username || 'no_username'}</p>
                    <p className="text-xs text-muted-foreground">ID: {user.telegram_id}</p>
                  </div>

                  <div>
                    {editingUser === user.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={newBalance}
                          onChange={(e) => setNewBalance(e.target.value)}
                          placeholder="Новый баланс"
                          className="bg-background"
                        />
                        <Button
                          onClick={() => updateBalance(user.id)}
                          className="bg-neon-cyan text-background"
                          size="sm"
                        >
                          <Icon name="Check" size={16} />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingUser(null);
                            setNewBalance('');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Icon name="X" size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name="Star" className="text-gold" size={20} />
                        <span className="text-xl font-montserrat font-bold text-gold">
                          {user.balance}
                        </span>
                        <Button
                          onClick={() => {
                            setEditingUser(user.id);
                            setNewBalance(user.balance.toString());
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-montserrat ${
                        user.is_admin
                          ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.is_admin ? '👑 Админ' : 'Игрок'}
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      className={`${
                        user.is_admin
                          ? 'bg-destructive hover:bg-destructive/80'
                          : 'bg-neon-pink hover:bg-neon-pink/80'
                      } text-white`}
                      size="sm"
                    >
                      {user.is_admin ? 'Убрать админа' : 'Сделать админом'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
