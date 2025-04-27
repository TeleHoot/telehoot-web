import { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { Calendar } from "lucide-react";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import dayjs from "dayjs";

const About = () => {
  const organizationContext = useContext(OrganizationContext);
  const currentOrganization = organizationContext?.activeOrganization;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Avatar className="w-full h-auto aspect-square rounded-lg">
            <AvatarImage
              src={currentOrganization?.image_path}
              alt={currentOrganization?.name}
              className="object-cover"
            />
            <AvatarFallback className="text-4xl">
              {currentOrganization?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Информация справа */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{currentOrganization?.name}</h1>
          </div>

          <p className="text-gray-600 mb-6">{currentOrganization?.description}</p>

          <div className="flex gap-4 text-sm text-gray-500">
            {/*<div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              {organization.membersCount} участников
            </div>*/
            }
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Основана в {dayjs(currentOrganization?.created_at).format("YYYY")}
            </div>
          </div>
        </div>
      </div>
    </div>);
};

export default About;
