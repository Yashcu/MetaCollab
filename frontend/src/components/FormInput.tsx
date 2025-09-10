import React from "react";
import { useFormContext, FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormInputProps extends React.ComponentProps<"input"> {
  name: string;
  label: string;
}

const FormInput = ({
  name,
  label,
  type = "text",
  ...props
}: FormInputProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name] as FieldError | undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        {...props}
        {...register(name)}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

export default FormInput;
