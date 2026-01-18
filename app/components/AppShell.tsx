type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  useContainer?: boolean;
};

export default function AppShell({
  children,
  className = "",
  containerClassName = "",
  useContainer = true,
}: AppShellProps) {
  const shellClasses =
    `min-h-screen bg-slate-50 text-gray-900 ${className}`.trim();
  const containerClasses = useContainer
    ? `mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 ${containerClassName}`.trim()
    : `w-full ${containerClassName}`.trim();

  return (
    <div className={shellClasses}>
      <div className={containerClasses}>{children}</div>
    </div>
  );
}
