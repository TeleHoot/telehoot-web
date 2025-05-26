import { FC, useEffect } from "react";
import { TelegramLoginProps } from "./TelegramLogin.types";

const botName = import.meta.env.VITE_BOT_NAME

const TelegramLogin: FC<TelegramLoginProps> = (props) => {
  const { callBack } = props;

  useEffect(() => {
    // Обработчик для получения сообщений от Telegram Widget
    const handleMessage = (event: MessageEvent) => {
      // Проверяем, что сообщение от Telegram Widget
      if (event.origin === "https://oauth.telegram.org") {
        const data = event.data;
        if (data.event === "auth_result") {
          // Вызываем callback с данными авторизации
          callBack(data);
        }
      }
    };

    // Добавляем обработчик сообщений
    window.addEventListener("message", handleMessage);

    // Динамическая загрузка Telegram Widget
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;

    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-auth-url", "https://oauth.telegram.org/auth");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    // Добавляем глобальную функцию, которую вызовет Telegram Widget
    (window as any).onTelegramAuth = (userData: any) => {
      callBack(userData);
    };

    const container = document.getElementById("telegram-widget-container");
    if (container) {
      container.appendChild(script);
    }

    return () => {
      if (container && script.parentNode) {
        container.removeChild(script);
      }
      window.removeEventListener("message", handleMessage);
      delete (window as any).onTelegramAuth;
    };
  }, [callBack]);

  return <div id="telegram-widget-container"></div>;
};

export default TelegramLogin;
