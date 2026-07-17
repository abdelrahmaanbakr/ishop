// مؤقتة — كل صفحة بتتبدل بالحقيقية في مرحلتها
export default function Placeholder({ name, phase }) {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-center">
      <h2 className="text-2xl font-black text-accent">{name}</h2>
      <p className="text-sm text-muted">تتبني في المرحلة {phase}</p>
    </div>
  );
}
