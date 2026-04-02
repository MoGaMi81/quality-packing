export default function Header() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <img src="/logo.png" className="h-8" />
        <span className="font-bold">Quality Packing</span>
      </div>
    </div>
  );
}