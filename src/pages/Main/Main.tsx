"use client";

import { useEffect, useState } from "react";
import { Button } from "@shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@shared/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@shared/components/ui/avatar";
import { Alert, AlertDescription } from "@shared/components/ui/alert";

export default function TelegramAuth() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Динамическая загрузка Telegram Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'daeqwesadhsaljkfdh_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-auth-url', '/api/telegram-auth');
    script.setAttribute('data-request-access', 'write');
    script.onload = () => setIsLoading(false);

    const container = document.getElementById('telegram-widget-container');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      if (container && script.parentNode) {
        container.removeChild(script);
      }
    };
  }, []);

  // Проверяем, есть ли данные пользователя в localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('telegram_user');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('telegram_user');
    setUserData(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">
            {userData ? 'Ваш профиль' : 'Авторизация'}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {userData ? (
            <div className="flex flex-col items-center space-y-4 w-full">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userData.photo_url} />
                <AvatarFallback>
                  {userData.first_name?.[0]}{userData.last_name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-medium">
                  {userData.first_name} {userData.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{userData.username}
                </p>
              </div>

              <div className="w-full pt-4">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                >
                  Выйти
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div id="telegram-widget-container" className="w-full" />

              <div className="relative w-full my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Или продолжите как гость
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Продолжить без входа
              </Button>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-center text-sm text-muted-foreground">
            {userData
              ? `Аккаунт привязан ${new Date(userData.auth_date * 1000).toLocaleDateString()}`
              : 'Вход через Telegram безопасен и не требует пароля'}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
