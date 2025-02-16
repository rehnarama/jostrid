import { ReactNode } from "react";
import { ExpenseCategory } from "../hooks/useExpenseCategory";
import {
  IconArmchair,
  IconBabyCarriage,
  IconBallFootball,
  IconBike,
  IconBolt,
  IconBottle,
  IconBuildingBank,
  IconBus,
  IconCar,
  IconCat,
  IconDeviceGamepad,
  IconDeviceMobile,
  IconDroplet,
  IconFlame,
  IconGasStation,
  IconGift,
  IconHammer,
  IconHome,
  IconHospital,
  IconMovie,
  IconMusic,
  IconNote,
  IconNotes,
  IconParking,
  IconPlane,
  IconReceiptTax,
  IconSchool,
  IconShirt,
  IconShoppingCart,
  IconSpray,
  IconToolsKitchen,
  IconTrash,
  IconWashMachine,
  IconWifi,
} from "@tabler/icons-react";

const FALLBACK_ICON = <IconNotes />;

const CATEGORY_ICON_MAP: Record<number, ReactNode> = {
  1: <IconWashMachine />,
  2: <IconBolt />,
  3: <IconFlame />,
  4: <IconNotes />,
  5: <IconTrash />,
  6: <IconWifi />,
  7: <IconDroplet />,
  8: <IconNotes />,
  9: <IconDeviceGamepad />,
  10: <IconMovie />,
  11: <IconMusic />,
  13: <IconBallFootball />,
  14: <IconToolsKitchen />,
  15: <IconShoppingCart />,
  16: <IconBottle />,
  18: <IconDeviceMobile />,
  19: <IconArmchair />,
  20: <IconSpray />,
  21: <IconHammer />,
  22: <IconBuildingBank />,
  24: <IconCat />,
  25: <IconBuildingBank />,
  26: <IconNotes />,
  27: <IconBike />,
  28: <IconBus />,
  29: <IconCar />,
  30: <IconGasStation />,
  31: <IconHome />,
  33: <IconParking />,
  34: <IconPlane />,
  35: <IconCar />,
  36: <IconBabyCarriage />,
  37: <IconShirt />,
  38: <IconSchool />,
  39: <IconGift />,
  40: <IconNote />,
  41: <IconHospital />,
  43: <IconReceiptTax />,
};

export interface CategoryIconProps {
  category: ExpenseCategory;
}

export const CategoryIcon = ({ category }: CategoryIconProps) => {
  return CATEGORY_ICON_MAP[category.id] ?? FALLBACK_ICON;
};
