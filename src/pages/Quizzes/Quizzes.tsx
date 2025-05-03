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
import { MoreVertical } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@shared/components/ui/pagination";
import { Skeleton } from "@shared/components/ui/skeleton";
import { useQuery } from "react-query";
import { getOrganizationQuizzes } from "@entity/Quiz";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { useNavigate } from "react-router-dom";

const QuizzesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
    console.log("Создать новый квиз");
  };

  const handleEditQuiz = (quizId: string) => {
    console.log("Редактировать квиз:", quizId);
  };

  const handleDeleteQuiz = (quizId: string) => {
    console.log("Удалить квиз:", quizId);
  };

  const handleRunQuiz = (quizId: string) => {
    console.log("Запустить квиз:", quizId);
  };

  // Рендер состояния загрузки
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Квизы</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-[400px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Рендер состояния ошибки
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
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

  // Рендер пустого состояния
  if (quizzes?.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Квизы</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Поиск по названию или автору..."
            className="max-w-md"
            disabled
          />
          <Button onClick={handleCreateQuiz}>
            Создать квиз
          </Button>
        </div>

        <div className="rounded-md border flex flex-col items-center justify-center h-[300px]">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Квизы не найдены</h3>
            <p className="text-muted-foreground mb-4">
              У вас пока нет ни одного квиза. Создайте первый квиз.
            </p>
            <Button onClick={handleCreateQuiz}>
              Создать квиз
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Основной рендер
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Квизы</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Поиск по названию или автору..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-md"
        />
        <Button onClick={handleCreateQuiz}>
          Создать квиз
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Вопросы</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead/>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedQuizzes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Ничего не найдено по вашему запросу
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuizzes?.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.name}</TableCell>

                  <TableCell>{quiz.questions_count}</TableCell>

                  <TableCell>{quiz.author.username}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRunQuiz(quiz.id)}>
                          Запустить
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditQuiz(quiz.id)}>
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-red-600"
                        >
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

      {filteredQuizzes?.length > 0 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4">
                  Страница {currentPage} из {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
