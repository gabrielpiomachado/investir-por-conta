export default function PublicPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <span className="text-foreground/70">
            This is a public page. You can access it without being
            authenticated.
          </span>
        </div>
      </div>
    </div>
  );
}
