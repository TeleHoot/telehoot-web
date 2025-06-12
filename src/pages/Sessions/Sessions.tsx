import { Download, Pencil, Ellipsis, MoreHorizontal, MoreVertical, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useContext, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/components/ui/tabs";
import { Navigate } from "react-router-dom";

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

const ABOUT_PAGE = "about";
const QUIZ_PAGE = "quizzes";
const MEMBERS_PAGE = "memberships";
const SETTINGS_PAGE = "settings";

type Pages = typeof ABOUT_PAGE | typeof QUIZ_PAGE | typeof MEMBERS_PAGE | typeof SETTINGS_PAGE;

const Sessions = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<Pages>(QUIZ_PAGE);
  const itemsPerPage = 8;

  const tabTriggerClass = `
    px-0 pb-3 relative shadow-none rounded-none
    text-[#71717A] font-medium font-inter
    cursor-pointer
    data-[state=active]:text-[#09090B]
    data-[state=active]:shadow-none
    data-[state=active]:after:content-['']
    data-[state=active]:after:absolute
    data-[state=active]:after:bottom-0
    data-[state=active]:after:left-0
    data-[state=active]:after:w-full
    data-[state=active]:after:h-[3px]
    data-[state=active]:after:bg-[#0D0BCC]
  `;

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
  const totalPages = Math.ceil(sessions.length / itemsPerPage);

  const paginatedSessions = sessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStartSession = () => {
    navigate(`/startQuiz/${quizId}`);
  };

  const handleEditQuiz = () => {
    navigate(`/quiz/${quizId}`);
  };

  const handleTabChange = (tab: Pages) => {
    setActiveTab(tab);
    navigate(`/organization/${currentOrganizationId}/${tab}`);
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
        <span className="font-manrope text-[16px] font-normal leading-5 text-[#09090B]">
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
            <span className="font-manrope text-[16px] font-normal leading-5 text-[#09090B]">
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
        if (row.original.status === "waiting" || row.original.status === "active") return (
          <span className="font-manrope text-[16px] font-normal leading-5 text-[#09090B]">
            Еще идет
          </span>
        );
        if (row.original.status === "cancelled") return (
          <span className="font-manrope text-[16px] font-normal leading-5 text-[#09090B]">
            -
          </span>
        );

        const start = new Date(row.original.created_at);
        const end = new Date(row.original.updated_at);
        const duration = Math.round(
          (end.getTime() - start.getTime()) / (1000 * 60),
        );
        return (
          <span className="font-manrope text-[16px] font-normal leading-5 text-[#09090B]">
            {duration} мин
          </span>
        );
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
        return (
          <span className="font-manrope text-[16px] font-normal capitalize leading-5 text-[#09090B]">
            {statusMap[status]}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const session = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="font-inter bg-white border border-gray-200 rounded-md shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => handleExportResults(session.id)}
                className="text-[#0D0BCC] focus:bg-blue-50 cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Экспорт в Excel
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`/session/results?sessionId=${session.id}&quizId=${quizId}`}
                  className="focus:bg-gray-100 cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2" />
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

      const url = URL.createObjectURL(new Blob([mutation?.data?.data]));

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `sessions_expoerted_${dayjs().format("DD.MM.YYYY_HH:mm")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Ошибка при экспорте результатов:", error);
    }
  }

  return (
    <div className="mx-auto max-w-[890px] space-y-6 font-inter px-4 py-10">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full mb-5 text-[#71717A] text-[16px]"
      >
        <TabsList className="w-full flex gap-8 p-0 bg-transparent">
          <TabsTrigger value={ABOUT_PAGE} className={tabTriggerClass}>
            Обзор
          </TabsTrigger>
          <TabsTrigger value={QUIZ_PAGE} className={tabTriggerClass} onClick={()=>handleTabChange('quizzes')}>
            Квизы
          </TabsTrigger>
          <TabsTrigger value={MEMBERS_PAGE} className={tabTriggerClass}>
            Пользователи
          </TabsTrigger>
          <TabsTrigger value={SETTINGS_PAGE} className={tabTriggerClass}>
            Настройки организации
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Информация о квизе */}
      <div className="px-0 py-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold leading-6 text-[#000000]">
                {quiz?.name}
              </h1>
              <Pencil
                onClick={handleEditQuiz}
                className="h-4 w-4 cursor-pointer"
              />
            </div>
            <p className="text-[16px] font-medium leading-5 text-[#707579]">
              {quiz?.description}
            </p>
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-[12px] font-medium leading-5 text-[#A2ACB0]">
                {quiz?.questions_count} вопросов
              </span>
              <span className="flex items-center gap-2 text-[12px] font-medium leading-5 text-[#A2ACB0]">
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
          <Button
            onClick={handleStartSession}
            className="h-[40px] w-[197px] min-w-[50px] cursor-pointer gap-[10px] rounded-[6px] bg-[#0D0BCC] px-[12px] py-[15px] hover:bg-[#0D0BCC]/90"
          >
            <span className="text-[17px] font-semibold leading-[22px] tracking-[-0.4px] text-[#FFFFFF]">
              Запустить
            </span>
          </Button>
        </div>
      </div>

      {/* Заголовок таблицы сессий */}
      <h2 className="text-[16px] font-medium leading-5 text-[#000000]">
        Все сессии
      </h2>

      {/* Таблица сессий */}
      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {sessionColumns.map((column) => (
                <TableHead
                  key={column.id || column.accessorKey}
                  className="font-manrope text-[16px] font-medium leading-5 text-[#71717A]"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.length > 0 ? (
              paginatedSessions.map((session) => (
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
                  className="h-24 text-center font-manrope text-[16px] font-normal leading-5 text-[#09090B]"
                >
                  Сессии не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      {sessions.length > itemsPerPage && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={`font-inter flex items-center gap-1 font-medium text-[14px] mr-3 ${
                currentPage === 1 ? "text-[#A2ACB0] cursor-not-allowed" : "cursor-pointer"
              }`}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" /> Предыдущий
            </button>

            {/* Всегда показываем первую страницу */}
            <button
              onClick={() => setCurrentPage(1)}
              className={`font-inter px-3 py-1 rounded ${
                currentPage === 1
                  ? "border border-[#0D0BCC] bg-white font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              1
            </button>

            {/* Показываем многоточие, если текущая страница далеко от начала */}
            {currentPage > 3 && totalPages > 4 && (
              <span className="px-2 text-[#707579]">...</span>
            )}

            {/* Показываем страницы вокруг текущей */}
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Показываем только близкие к текущей странице номера (и не первую/последнюю)
              if (
                pageNumber > 1 &&
                pageNumber < totalPages &&
                Math.abs(pageNumber - currentPage) <= 1
              ) {
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`font-inter px-3 py-1 rounded ${
                      currentPage === pageNumber
                        ? "border border-[#0D0BCC] bg-white font-medium"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              }
              return null;
            })}

            {/* Показываем многоточие, если текущая страница далеко от конца */}
            {currentPage < totalPages - 2 && totalPages > 4 && (
              <span className="px-2 text-[#707579]">...</span>
            )}

            {/* Всегда показываем последнюю страницу, если она не первая */}
            {totalPages > 1 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`font-inter px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "border border-[#0D0BCC] bg-white font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className={`font-inter flex items-center gap-1 font-medium text-[14px] ml-3 ${
                currentPage === totalPages ? "text-[#A2ACB0] cursor-not-allowed" : "cursor-pointer"
              }`}
              disabled={currentPage === totalPages}
            >
              Следующий <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
