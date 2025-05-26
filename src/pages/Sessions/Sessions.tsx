import { Download, Edit, Ellipsis, MoreHorizontal } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useContext } from "react";

import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { getQuiz } from "@entity/Quiz";
import { exportResults, getQuizSessions, SessionStatus } from "@entity/Session";
import { useMutation, useQuery } from "react-query";

const Sessions = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;
  const navigate = useNavigate();

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    error: sessionsError,
  } = useQuery({
    queryKey: ["quizSessions", quizId],
    queryFn: () =>
      getQuizSessions({
        organizationId: currentOrganizationId as string,
        quizId: quizId as string,
      }),
    enabled: !!quizId && !!currentOrganizationId,
  });

  const {
    data: quizData,
    isLoading: isLoadingQuiz,
    error: quizError,
  } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      return await getQuiz({
        organizationId: currentOrganizationId,
        quizId: quizId,
      });
    },
    enabled: !!quizId && !!currentOrganizationId,
  });

  const mutation = useMutation(exportResults);

  const quiz = quizData?.data;
  const sessions = sessionsData?.data || [];
  console.log(quiz);

  const handleStartSession = () => {
    navigate(`/startQuiz/${quizId}`);
  };

  const handleEditQuiz = () => {
    navigate(`/quiz/${quizId}`);
  };

  if (isLoadingQuiz || isLoadingSessions) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (quizError || sessionsError) {
    return (
      <div className="rounded-lg border border-destructive p-4 text-destructive">
        Ошибка загрузки данных: {quizError?.message || sessionsError?.message}
      </div>
    );
  }

  const sessionColumns = [
    {
      accessorKey: "created_at",
      header: "Дата",
      cell: ({ row }) => (
        <span>
        {dayjs(row.original.created_at).format("DD.MM.YYYY")}
      </span>
      ),
    },
    {
      accessorKey: "author",
      header: "Ведущий",
      cell: ({ row }) => {
        const author = row.original.hosts[0].user.telegram_username;
        return (
          <div className="flex items-center gap-2">
          <span>
            @{author}
          </span>
          </div>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Длительность",
      cell: ({ row }) => {
        if (row.original.status === "waiting" || row.original.status === "active") return <span>Еще идет</span>;
        if (row.original.status === "cancelled") return <span>-</span>;

        const start = new Date(row.original.created_at);
        const end = new Date(row.original.updated_at);
        const duration = Math.round(
          (end.getTime() - start.getTime()) / (1000 * 60),
        );
        return <span>{duration} мин</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusMap: Record<SessionStatus, string> = {
          waiting: "Ожидание",
          active: "Активна",
          completed: "Завершена",
          cancelled: "Отменена",
        };
        return <span className="capitalize">{statusMap[status]}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const session = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExportResults(session.id)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в Excel
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`/session/${session.id}/results`}
                  className="flex items-center gap-2"
                >
                  <Ellipsis className="h-4 w-4" />
                  Просмотр результатов
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];


  async function handleExportResults(sessionId: string) {
    try {
      mutation.mutate({
        organizationId: currentOrganizationId as string,
        quizId: quizId as string,
        sessionId: sessionId,
      });

      if (!mutation?.data?.data) return;
      console.log(mutation.data.data);

      const url = URL.createObjectURL(new Blob([mutation?.data?.data]));

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `benefits_${dayjs().format("DD.MM.YYYY_HH:mm")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Ошибка при экспорте результатов:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Информация о квизе */}
      <div className="rounded-lg border p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{quiz?.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEditQuiz}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">{quiz?.description}</p>
            <div className="flex items-center gap-4 pt-2 text-sm">
              <span className="text-muted-foreground">
                {quiz?.questions_count} вопросов
              </span>
              <span className="flex items-center gap-2">
                <img
                  src={quiz?.author.photo_url}
                  alt={quiz?.author.username}
                  className="h-6 w-6 rounded-full"
                />
                <span>
                  {quiz?.author.first_name} {quiz?.author.last_name}
                </span>
              </span>
            </div>
          </div>
          <Button onClick={handleStartSession}>Начать сессию</Button>
        </div>
      </div>

      {/* Таблица сессий */}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {sessionColumns.map((column) => (
                <TableHead key={column.id || column.accessorKey}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  {sessionColumns.map((column) => (
                    <TableCell key={column.id || column.accessorKey}>
                      {column.cell({ row: { original: session } })}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={sessionColumns.length}
                  className="h-24 text-center"
                >
                  Сессии не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sessions;
