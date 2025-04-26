import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { TelegramLogin, type TelegramLoginData } from "@feature/TelegramLogin";
import { useMutation, useQueryClient } from "react-query";
import { auth } from "@entity/User";

export default function AuthForm() {
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, TelegramLoginData>(
    "auth",
    auth,
    {
      onSuccess: () => {
        queryClient.invalidateQueries("auth");
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    },
  );

  const authorize = (data: TelegramLoginData) => {
    console.log(data);
    mutation.mutate(data); // Вызываем мутацию с полученными данными
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">
            Вход в Telehoot
          </CardTitle>

          <p className="text-center text-sm text-muted-foreground">
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
