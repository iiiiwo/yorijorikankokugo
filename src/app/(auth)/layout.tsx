export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-korean-light via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black korean-text text-korean-red mb-1">
            요리조리 한국어
          </h1>
          <p className="text-gray-500 text-sm">あちこちから韓国語にアプローチ</p>
        </div>
        {children}
      </div>
    </div>
  );
}
