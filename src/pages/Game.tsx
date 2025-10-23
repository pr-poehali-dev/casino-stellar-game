import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useTelegramUser } from '@/hooks/useTelegramUser';

const AUTH_API_URL = 'https://functions.poehali.dev/eb5e99d4-7313-4b64-b27c-7412333f3e6c';
const GAME_API_URL = 'https://functions.poehali.dev/d87658dd-0c7d-4a3b-8ec9-a6c5dfbc7473';

interface Player {
  name: string;
  stars: number;
  multiplier: number;
}

interface ChatMessage {
  user: string;
  message: string;
  timestamp: number;
}

interface UserData {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  balance: number;
  is_admin: boolean;
}

const Game = () => {
  const navigate = useNavigate();
  const telegramUser = useTelegramUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [autoCashout, setAutoCashout] = useState('');
  const [currentWin, setCurrentWin] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const intervalRef = useRef<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { user: 'Космонавт777', message: 'Кто поставил на 50x? 🚀', timestamp: Date.now() - 60000 },
    { user: 'StarHunter', message: 'Поехали! Взлетаем!', timestamp: Date.now() - 45000 },
    { user: 'NeonKing', message: 'Автостоп на 25x включил', timestamp: Date.now() - 30000 },
  ]);

  useEffect(() => {
    authenticateUser();
    fetchLeaderboard();
  }, []);

  const authenticateUser = async () => {
    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegram_id: telegramUser.user.id,
          username: telegramUser.user.username,
          first_name: telegramUser.user.firstName,
          last_name: telegramUser.user.lastName
        })
      });

      if (!response.ok) {
        throw new Error('Auth failed');
      }

      const data = await response.json();
      setUserData(data.user);
      setBalance(data.user.balance);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось авторизоваться',
        variant: 'destructive'
      });
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(GAME_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard');
    }
  };

  useEffect(() => {
    if (isFlying && !hasCrashed && userData) {
      const targetMultiplier = Math.random() * 50 + 1;
      const increment = 0.01;
      const speed = 50;

      intervalRef.current = window.setInterval(() => {
        setMultiplier((prev) => {
          const newMultiplier = prev + increment;
          
          if (autoCashout && newMultiplier >= parseFloat(autoCashout)) {
            handleCashout();
            return newMultiplier;
          }

          if (newMultiplier >= targetMultiplier) {
            handleCrash();
            return newMultiplier;
          }

          return newMultiplier;
        });
      }, speed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isFlying, hasCrashed, autoCashout, userData]);

  const startGame = async () => {
    if (!userData) {
      toast({ title: 'Подождите авторизации', variant: 'destructive' });
      return;
    }

    if (bet > balance) {
      toast({ title: 'Недостаточно звёзд!', variant: 'destructive' });
      return;
    }
    if (bet <= 0) {
      toast({ title: 'Ставка должна быть больше 0', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(GAME_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'place_bet',
          user_id: userData.id,
          bet_amount: bet
        })
      });

      if (!response.ok) {
        throw new Error('Failed to place bet');
      }

      const data = await response.json();
      setBalance(data.balance);
      setMultiplier(1.00);
      setIsFlying(true);
      setHasCrashed(false);
      setHasWon(false);
      setCurrentWin(0);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сделать ставку',
        variant: 'destructive'
      });
    }
  };

  const handleCashout = async () => {
    if (!isFlying || hasCrashed || hasWon || !userData) return;
    
    try {
      const response = await fetch(GAME_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cashout',
          user_id: userData.id,
          bet_amount: bet,
          multiplier: multiplier,
          auto_cashout: autoCashout ? parseFloat(autoCashout) : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cashout');
      }

      const data = await response.json();
      setBalance(data.balance);
      setCurrentWin(data.win_amount);
      setIsFlying(false);
      setHasWon(true);
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      toast({
        title: `🌟 Выиграл ${data.win_amount} звёзд!`,
        description: `Множитель: ${multiplier.toFixed(2)}x`,
      });

      setTimeout(() => {
        setHasWon(false);
        setCurrentWin(0);
      }, 3000);

      fetchLeaderboard();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось забрать выигрыш',
        variant: 'destructive'
      });
    }
  };

  const handleCrash = () => {
    setHasCrashed(true);
    setIsFlying(false);
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    toast({
      title: '💥 Крушение!',
      description: `Самолёт разбился на ${multiplier.toFixed(2)}x`,
      variant: 'destructive',
    });

    setTimeout(() => {
      setHasCrashed(false);
    }, 3000);
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setChatHistory([...chatHistory, {
      user: telegramUser.user.firstName,
      message: chatMessage,
      timestamp: Date.now()
    }]);
    setChatMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted font-roboto">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-6xl font-montserrat font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-yellow animate-neon-pulse tracking-wider mb-2"
              style={{ textShadow: '0 0 20px hsl(var(--neon-pink)), 0 0 40px hsl(var(--neon-cyan))' }}>
            ⭐ STAR CASINO ⭐
          </h1>
          <p className="text-neon-cyan text-lg font-montserrat" style={{ textShadow: '0 0 10px hsl(var(--neon-cyan))' }}>
            CRASH GAME
          </p>
          {userData?.is_admin && (
            <Button
              onClick={() => navigate('/admin')}
              className="mt-4 bg-neon-pink text-white hover:bg-neon-pink/80"
              style={{ boxShadow: '0 0 10px hsl(var(--neon-pink))' }}
            >
              <Icon name="Shield" className="mr-2" size={20} />
              Админ-панель
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-card border-2 border-neon-pink p-8 relative overflow-hidden" 
                  style={{ boxShadow: '0 0 20px hsl(var(--neon-pink))' }}>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-gold/20 px-4 py-2 rounded-full border-2 border-gold"
                   style={{ boxShadow: '0 0 15px hsl(var(--gold))' }}>
                <Icon name="Star" className="text-gold" size={24} />
                <span className="text-gold font-montserrat font-bold text-xl">{balance.toFixed(0)}</span>
              </div>

              <div className="h-96 bg-gradient-to-br from-muted/50 to-background rounded-xl border-2 border-neon-cyan mb-6 flex items-center justify-center relative overflow-hidden"
                   style={{ boxShadow: 'inset 0 0 30px hsl(var(--neon-cyan))' }}>
                <div className="absolute inset-0 opacity-10">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute text-4xl animate-float"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                      }}
                    >
                      ⭐
                    </div>
                  ))}
                </div>

                <div className="relative z-10">
                  {!isFlying && !hasCrashed && !hasWon && (
                    <div className="text-center">
                      <Icon name="Plane" className="text-neon-cyan mx-auto mb-4 animate-float" size={80} />
                      <p className="text-neon-cyan text-xl font-montserrat">Готов к взлёту!</p>
                    </div>
                  )}

                  {isFlying && !hasCrashed && (
                    <div className="text-center">
                      <Icon name="Plane" 
                            className="text-neon-yellow mx-auto mb-4 animate-plane-fly"
                            size={80} 
                            style={{ filter: 'drop-shadow(0 0 20px hsl(var(--neon-yellow)))' }} />
                      <div className="text-8xl font-montserrat font-black text-neon-yellow animate-neon-pulse"
                           style={{ textShadow: '0 0 30px hsl(var(--neon-yellow)), 0 0 60px hsl(var(--gold))' }}>
                        {multiplier.toFixed(2)}x
                      </div>
                      <p className="text-neon-cyan text-xl mt-4">Потенциальный выигрыш: {(bet * multiplier).toFixed(0)} ⭐</p>
                    </div>
                  )}

                  {hasCrashed && (
                    <div className="text-center">
                      <div className="text-8xl mb-4 animate-crash">💥</div>
                      <div className="text-6xl font-montserrat font-black text-destructive"
                           style={{ textShadow: '0 0 20px hsl(var(--destructive))' }}>
                        {multiplier.toFixed(2)}x
                      </div>
                      <p className="text-destructive text-2xl mt-4 font-montserrat">КРУШЕНИЕ!</p>
                    </div>
                  )}

                  {hasWon && (
                    <div className="text-center">
                      <div className="text-8xl mb-4 animate-bounce">🎉</div>
                      <div className="text-6xl font-montserrat font-black text-neon-yellow"
                           style={{ textShadow: '0 0 30px hsl(var(--neon-yellow))' }}>
                        +{currentWin.toFixed(0)} ⭐
                      </div>
                      <p className="text-neon-cyan text-2xl mt-4 font-montserrat">ПОБЕДА!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-neon-pink font-montserrat font-semibold mb-2 block">Ставка (⭐)</label>
                  <Input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    disabled={isFlying}
                    className="bg-muted border-neon-pink text-foreground font-roboto text-lg"
                  />
                </div>
                <div>
                  <label className="text-neon-cyan font-montserrat font-semibold mb-2 block">Автостоп (x)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(e.target.value)}
                    placeholder="Например: 2.5"
                    disabled={isFlying}
                    className="bg-muted border-neon-cyan text-foreground font-roboto text-lg"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                {!isFlying ? (
                  <Button
                    onClick={startGame}
                    className="flex-1 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-montserrat font-bold text-xl py-6 hover:scale-105 transition-transform"
                    style={{ boxShadow: '0 0 20px hsl(var(--neon-pink)), 0 0 40px hsl(var(--neon-cyan))' }}
                  >
                    <Icon name="Rocket" className="mr-2" size={24} />
                    ЗАПУСК
                  </Button>
                ) : (
                  <Button
                    onClick={handleCashout}
                    disabled={hasCrashed || hasWon}
                    className="flex-1 bg-gradient-to-r from-neon-yellow to-gold text-background font-montserrat font-bold text-xl py-6 hover:scale-105 transition-transform"
                    style={{ boxShadow: '0 0 20px hsl(var(--gold))' }}
                  >
                    <Icon name="DollarSign" className="mr-2" size={24} />
                    ЗАБРАТЬ {(bet * multiplier).toFixed(0)} ⭐
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-2 border-neon-yellow p-6"
                  style={{ boxShadow: '0 0 15px hsl(var(--gold))' }}>
              <h2 className="text-2xl font-montserrat font-bold text-neon-yellow mb-4 flex items-center gap-2"
                  style={{ textShadow: '0 0 10px hsl(var(--gold))' }}>
                <Icon name="Trophy" size={28} />
                Лидеры
              </h2>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-neon-yellow/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-montserrat font-bold text-gold">#{index + 1}</span>
                      <div>
                        <p className="font-montserrat font-semibold text-foreground">{player.name}</p>
                        <p className="text-sm text-muted-foreground">Макс. {player.multiplier.toFixed(1)}x</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-montserrat font-bold text-gold">
                      <Icon name="Star" size={18} />
                      {player.stars.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-card border-2 border-neon-cyan p-6"
                  style={{ boxShadow: '0 0 15px hsl(var(--neon-cyan))' }}>
              <h2 className="text-2xl font-montserrat font-bold text-neon-cyan mb-4 flex items-center gap-2"
                  style={{ textShadow: '0 0 10px hsl(var(--neon-cyan))' }}>
                <Icon name="MessageCircle" size={28} />
                Чат
              </h2>
              <div className="space-y-2 mb-4 h-64 overflow-y-auto">
                {chatHistory.map((msg, index) => (
                  <div key={index} className="bg-muted/50 p-2 rounded">
                    <p className="text-xs text-muted-foreground">{msg.user}</p>
                    <p className="text-sm text-foreground">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Написать сообщение..."
                  className="bg-muted border-neon-cyan text-foreground"
                />
                <Button
                  onClick={sendMessage}
                  className="bg-neon-cyan text-background hover:bg-neon-cyan/80"
                  style={{ boxShadow: '0 0 10px hsl(var(--neon-cyan))' }}
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
