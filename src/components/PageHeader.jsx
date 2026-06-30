import React from 'react';

const PageHeader = ({ title, subtitle, actions, contentClassName = 'max-w-[1600px]', paddingClassName = 'px-4 sm:px-6 md:px-8' }) => {
  if (!title && !subtitle && !actions) return null;

  return (
    <section className={`border-b border-slate-100 bg-white py-5 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:py-6 ${paddingClassName}`}>
      <div className={`${contentClassName} mx-auto flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}>
        <div className="min-w-0">
          {title && (
            <h1 className="max-w-full break-words text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 max-w-full break-words text-sm font-normal leading-snug text-slate-500 dark:text-slate-400 md:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
};

export default PageHeader;
