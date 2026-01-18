type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}
