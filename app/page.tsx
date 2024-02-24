export default function Home() {
  const names = ["Tom", "Esther", "Ryan", "Matt", "Amelia"];
  return (
    <div className="grid place-items-center">
      <div className="w-[60%] py-16 border-b-2">
        <div className="flex">
          <div className="rounded border-[1px] px-4 py-1 pl-8">Dropdown</div>
          <div className="mx-2 grid">
            <input
              type="text"
              className="bg-gray-100 rounded w-32 px-4"
              placeholder="£0.00"
            />
          </div>
          <div className="flex-grow grid grid-cols-6 text-center gap-2">
            {names.map((name, i) => (
              <div key={i}>
                <button className="bg-orange-500 text-yellow-300 rounded w-full py-1 border-[1px] border-orange-500 ">
                  {name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
