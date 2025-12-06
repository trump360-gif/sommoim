import { ReactNode } from 'react';

interface AdminPageLayoutProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    filters?: ReactNode;
    children: ReactNode;
}

export function AdminPageLayout({
    title,
    description,
    actions,
    filters,
    children,
}: AdminPageLayoutProps) {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {description && (
                        <p className="mt-1 text-sm text-gray-500">{description}</p>
                    )}
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>

            {/* Filters */}
            {filters && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    {filters}
                </div>
            )}

            {/* Content */}
            <div>{children}</div>
        </div>
    );
}
