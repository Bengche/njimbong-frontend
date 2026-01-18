type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-emerald-100 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-gray-600 md:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
