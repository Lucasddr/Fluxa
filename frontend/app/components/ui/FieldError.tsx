interface FieldErrorProps {
  id?: string;
  children: string;
}

export default function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className="text-xs text-negative mt-1.5"
    >
      {children}
    </p>
  );
}
