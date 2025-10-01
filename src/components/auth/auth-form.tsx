import * as React from "react";
import { useForm, UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

interface AuthFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  onSubmit: (data: T, form: UseFormReturn<T>) => void;
  children: (form: UseFormReturn<T>) => React.ReactNode;
  submitText: string;
  loadingText: string;
  isLoading?: boolean;
  className?: string;
}

export function AuthForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  submitText,
  loadingText,
  isLoading = false,
  className = "space-y-4",
}: AuthFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = (data: T) => {
    onSubmit(data, form);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {children(form)}

        {form.formState.errors.root && (
          <div className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button type="submit" size="sm" className="w-full" disabled={isLoading}>
          {isLoading ? loadingText : submitText}
        </Button>
      </form>
    </Form>
  );
}