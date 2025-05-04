import { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { Calendar } from "lucide-react";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import dayjs from "dayjs";

const About = () => {
  const organizationContext = useContext(OrganizationContext);
  const currentOrganization = organizationContext?.activeOrganization;
  console.log(currentOrganization?.image_path);

  return (
    <div className="mx-auto py-8 max-w-[890px] px-4">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="w-[152px] h-[152px] flex-shrink-0">
          <Avatar className="w-full h-full rounded-lg bg-white">
            <AvatarImage
              src={currentOrganization?.image_path}
              alt={currentOrganization?.name}
              className="object-cover w-full h-full"
            />
            <AvatarFallback className="text-4xl w-full h-full flex items-center justify-center">
              {currentOrganization?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <h1 className="font-inter font-semibold text-[20px]">
              {currentOrganization?.name}
            </h1>
          </div>

          <p className="font-manrope text-[16px] font-medium">
            {currentOrganization?.description}
          </p>

          <div className="flex gap-4 font-manrope text-[16px] font-medium text-gray-500 mt-3">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
              Основана в {dayjs(currentOrganization?.created_at).format("YYYY")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;