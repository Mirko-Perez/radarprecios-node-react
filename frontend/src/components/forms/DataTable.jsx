const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = "No se encontraron datos",
  className = "",
  rowClassName = "",
  headerClassName = "bg-gray-100 text-gray-700",
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto bg-white shadow rounded-lg ${className}`}>
      <table className="w-full text-sm text-left">
        <thead className={headerClassName}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={`px-4 py-2 ${column.headerClassName || ""}`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`border-b hover:bg-gray-50 transition-colors ${rowClassName}`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={`${rowIndex}-${column.key || colIndex}`}
                    className={`px-4 py-2 ${column.className || ""}`}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key] || "-"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-gray-500 py-8 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
