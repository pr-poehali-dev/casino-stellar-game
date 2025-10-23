import { useInitData, useLaunchParams } from '@telegram-apps/sdk-react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export function useTelegramUser() {
  const initData = useInitData();
  const launchParams = useLaunchParams();

  const user = initData?.user;

  if (!user) {
    return {
      user: {
        id: 123456789,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser'
      } as TelegramUser,
      isLoading: false,
      isReady: true,
      platform: launchParams?.platform || 'unknown'
    };
  }

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl
    } as TelegramUser,
    isLoading: false,
    isReady: true,
    platform: launchParams?.platform || 'unknown'
  };
}
