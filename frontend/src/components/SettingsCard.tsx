// frontend/src/components/SettingsCard.tsx

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const SettingsCard = ({
  title,
  description,
  children,
  footer,
}: SettingsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>{footer}</CardFooter>
    </Card>
  );
};

export default SettingsCard;
