import { useContext, useState } from "react";
import { Input } from "@shared/components/ui/input";
import { Button } from "@shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Loader2,
  MoreVertical,
  Search,
  Play,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@shared/components/ui/pagination";
import { useQuery } from "react-query";
import { getOrganizationQuizzes } from "@entity/Quiz";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { useNavigate } from "react-router-dom";

const QuizzesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;

  const { data: quizzesQuery, isLoading, error } = useQuery("quizzes",
    () => getOrganizationQuizzes(currentOrganizationId as string), {
      enabled: !!currentOrganizationId,
    },
  );
  const quizzes = quizzesQuery?.data;

  const filteredQuizzes = quizzes?.filter(quiz =>
    quiz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.author.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedQuizzes = filteredQuizzes?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = filteredQuizzes ? Math.ceil(filteredQuizzes?.length / itemsPerPage) : 0;

  const navigate = useNavigate();

  const handleCreateQuiz = () => {
    navigate("/quiz", { replace: true });
  };

  const handleEditQuiz = (quizId: string) => {
    navigate(`/quiz/${quizId}`, { replace: true });
  };

  const handleViewSessions = (quizId: string) => {
    navigate(`/sessions/${quizId}`, { replace: true });
  };

  const handleDeleteQuiz = (quizId: string) => {
    console.log("Удалить квиз:", quizId);
  };

  const handleRunQuiz = (quizId: string) => {
    navigate(`/startQuiz/${quizId}`, { replace: true });
  };

  // Общие стили для кнопки создания
  const createButtonStyle = {
    width: "197px",
    height: "40px",
    backgroundColor: "#0D0BCC",
    color: "white",
    fontFamily: "Inter, sans-serif",
  };

  // Общий компонент для заголовка
  const PageHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h1 className="font-inter font-normal text-[20px] text-[#18191B]">Все квизы</h1>
    </div>
  );

  // Общий компонент для поиска и кнопки создания
  const SearchAndCreate = ({ disabledSearch = false }: { disabledSearch?: boolean }) => (
    <div className="flex gap-4 mb-6 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или автору..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9"
          disabled={disabledSearch}
        />
      </div>
      <Button
        onClick={handleCreateQuiz}
        style={createButtonStyle}
        className="font-inter cursor-pointer"
      >
        Создать квиз
      </Button>
    </div>
  );

  // Рендер состояния загрузки
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-[890px]">
        <PageHeader />
        <SearchAndCreate disabledSearch />
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#0D0BCC]" />
        </div>
      </div>
    );
  }

  // Рендер состояния ошибки
  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-[890px]">
        <PageHeader />
        <div className="flex flex-col items-center justify-center h-[300px] text-center text-manrope">
          <h2 className="text-xl font-semibold mb-2">Произошла ошибка</h2>
          <p className="text-muted-foreground mb-4">
            Не удалось загрузить список квизов. Пожалуйста, попробуйте позже.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Повторить попытку
          </Button>
        </div>
      </div>
    );
  }

  // Основной рендер (включая состояние без квизов)
  return (
    <div className="container mx-auto py-8 max-w-[890px]">
      <PageHeader />
      <SearchAndCreate />

      {/* Рендер для состояния без квизов */}
      {quizzes?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <FileQuestion className="h-8 w-8 text-muted-foreground mb-4" style={{ width: 32, height: 32 }} />
          <h3 className="text-[20px] font-manrope font-normal text-[#18191B] mb-2">
            В данной организации нет квизов
          </h3>
          <p className="text-[12px] font-manrope font-normal text-[#707579]">
            Создайте свой первый квиз и он отобразится здесь
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Вопросы</TableHead>
                  <TableHead>Автор</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuizzes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-manrope">
                      Ничего не найдено по вашему запросу
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuizzes?.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell className="font-medium font-inter">{quiz.name}</TableCell>
                      <TableCell className="text-manrope">{quiz.questions_count}</TableCell>
                      <TableCell className="text-manrope">{quiz.author.username}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-inter bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                            <DropdownMenuItem
                              onClick={() => handleRunQuiz(quiz.id)}
                              className="text-[#0D0BCC] focus:bg-blue-50 dark:focus:bg-blue-900/30 cursor-pointer"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Запустить
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewSessions(quiz.id)}
                              className="focus:bg-gray-100 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />

                              Посмотреть сессии
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditQuiz(quiz.id)}
                              className="focus:bg-gray-100 cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/30 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredQuizzes && filteredQuizzes.length > itemsPerPage && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={`font-inter flex items-center gap-1 font-medium text-[14px] mr-3 ${
                        currentPage === 1 ? "text-[#A2ACB0] cursor-not-allowed" : "cursor-pointer"
                      }`}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Предыдущий
                    </button>
                  </PaginationItem>

                  {/* Всегда показываем первую страницу */}
                  <PaginationItem>
                    <Button
                      onClick={() => setCurrentPage(1)}
                      variant={currentPage === 1 ? "outline" : "ghost"}
                      className={`font-inter cursor-pointer ${
                        currentPage === 1
                          ? "border-[#0D0BCC] bg-white"
                          : "hover:bg-transparent"
                      }`}
                    >
                      1
                    </Button>
                  </PaginationItem>

                  {/* Показываем многоточие, если текущая страница далеко от начала */}
                  {currentPage > 3 && totalPages > 4 && (
                    <PaginationItem>
                      <span className="px-2 text-[#707579]">...</span>
                    </PaginationItem>
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
                        <PaginationItem key={index}>
                          <Button
                            onClick={() => setCurrentPage(pageNumber)}
                            variant={currentPage === pageNumber ? "outline" : "ghost"}
                            className={`font-inter cursor-pointer ${
                              currentPage === pageNumber
                                ? "border-[#0D0BCC] bg-white"
                                : "hover:bg-transparent"
                            }`}
                          >
                            {pageNumber}
                          </Button>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {/* Показываем многоточие, если текущая страница далеко от конца */}
                  {currentPage < totalPages - 2 && totalPages > 4 && (
                    <PaginationItem>
                      <span className="px-2 text-[#707579]">...</span>
                    </PaginationItem>
                  )}

                  {/* Всегда показываем последнюю страницу, если она не первая */}
                  {totalPages > 1 && (
                    <PaginationItem>
                      <Button
                        onClick={() => setCurrentPage(totalPages)}
                        variant={currentPage === totalPages ? "outline" : "ghost"}
                        className={`font-inter cursor-pointer ${
                          currentPage === totalPages
                            ? "border-[#0D0BCC] bg-white"
                            : "hover:bg-transparent"
                        }`}
                      >
                        {totalPages}
                      </Button>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={`font-inter flex items-center gap-1 font-medium text-[14px] ml-3 ${
                        currentPage === totalPages ? "text-[#A2ACB0] cursor-not-allowed" : "cursor-pointer"
                      }`}
                      disabled={currentPage === totalPages}
                    >
                      Следующий <ChevronRight className="h-4 w-4" />
                    </button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuizzesPage;
