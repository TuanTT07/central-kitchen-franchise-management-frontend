interface HeaderLayoutProps {
  /** Chuỗi in đậm sau “Xin chào …” — thường là tên vai trò (đã Việt hoá). */
  welcomeHighlight: string;
}

export default function HeaderLayout({ welcomeHighlight }: HeaderLayoutProps) {
  const display = welcomeHighlight?.trim() || 'bạn';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-white px-6 shadow-sm">
      <p className="text-sm text-muted-foreground sm:text-[15px]">
        Xin chào <span className="font-semibold text-foreground">{display}</span>, chào mừng trở lại!
      </p>
    </header>
  );
}
