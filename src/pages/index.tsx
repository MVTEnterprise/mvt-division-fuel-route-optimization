// Dispatch and order number

const Home = () => {
  return (
    <div className="m-16">
      {/* Search Header */}
      <div className="rounded border border-slate-200 px-8 py-6 flex gap-4 items-end">
        {/* Input */}
        <div className="flex flex-col items-start">
          <label className="text-sm mb-1.5">Dispatch number</label>
          <input
            className="border border-slate-300 rounded px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-slate-500"
            type="text"
            placeholder="Enter dispatch number"
          />
        </div>

        {/* Input */}
        <div className="flex flex-col items-start">
          <label className="text-sm mb-1.5">Order number</label>
          <input
            className="border border-slate-300 rounded px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-slate-500"
            type="text"
            placeholder="Enter dispatch number"
          />
        </div>

        <button className="bg-slate-800 text-white px-8 py-2.5 text-sm rounded">Search</button>
      </div>
      <div>Map area here</div>
    </div>
  );
};

export default Home;
