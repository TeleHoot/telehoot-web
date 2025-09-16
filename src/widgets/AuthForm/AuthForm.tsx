import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { TelegramLogin, type TelegramLoginData } from "@feature/TelegramLogin";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { auth } from "@entity/User";

export default function AuthForm() {
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation<void, Error, TelegramLoginData>(
    "auth",
    auth,
    {
      onSuccess: () => {
        queryClient.invalidateQueries("auth");
        navigate("/");
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    },
  );

  const authorize = (data: TelegramLoginData) => {
    mutation.mutate(data); // Вызываем мутацию с полученными данными
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bgauth p-4">
      <Card className="w-full max-w-md shadow-lg bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-[24px] text-center font-manrope font-weight-700 text-[#18191B]">
            Вход в Telehoot
          </CardTitle>

          <p className="text-center text-[14px] font-manrope font-weight-400 text-[#707579]">
            Создать квиз и посмотреть статистику
          </p>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4 w-full">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TelegramLogin callBack={authorize} />
        </CardContent>
      </Card>
    </div>
  );
}
