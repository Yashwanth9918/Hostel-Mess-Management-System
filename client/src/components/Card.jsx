import React from "react";

export default function Card({ icon, title, description, actions }) {
  return (
    <div className="bg-card rounded-xl shadow-soft hover:shadow-hover transition-shadow border border-neutral-200">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center text-xl">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-neutral-600 mt-1">{description}</p>}
            {actions && <div className="mt-4 flex items-center gap-3 flex-wrap">{actions}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
