import React from 'react';

const PageHeader = ({ title, icon: Icon, description }) => (
  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
    {Icon && (
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Icon size={24} />
        </div>
    )}
    <div>
      <h1 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h1>
      {description && <p className="text-slate-500 text-sm mt-1 font-medium">{description}</p>}
    </div>
  </div>
);

export default PageHeader;
