export default function GroupPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Create or Join a Travel Group
      </h2>
      <form className="grid gap-4 max-w-md">
        <input
          type="text"
          placeholder="Group Name"
          className="border p-2 rounded bg-transparent"
        />
        <select
          className="border p-2 rounded bg-transparent"
          aria-label="Group Privacy Setting"
        >
          <option>Public</option>
          <option>Private</option>
        </select>
        <button className="bg-primary text-white px-4 py-2 rounded">
          Create
        </button>
      </form>
    </div>
  );
}
