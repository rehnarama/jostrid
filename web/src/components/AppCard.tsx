import { ReactNode } from "react";
import { Card, CardBody, Link } from "@heroui/react";
import { To } from "react-router";

export interface AppCardProps {
  to: To;
  name: string;
  description?: string;
  icon?: ReactNode;
}

export const AppCard = (props: AppCardProps) => {
  return (
    <Card
      isPressable
      isHoverable
      as={Link}
      href={props.to}
      className="aspect-square"
    >
      <CardBody className="flex flex-col">
        <div className="size-10 mb-auto">{props.icon}</div>
        <p className="text-small font-bold">{props.name}</p>
        <p className="text-small">{props.description}</p>
      </CardBody>
    </Card>
  );
};
