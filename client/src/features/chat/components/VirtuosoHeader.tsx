
interface VirtuosoHeaderProps {
  context: {
    isFetchingNextPage: boolean;
  };
}

export const VirtuosoHeader = ({ context }: VirtuosoHeaderProps) => {
  const { isFetchingNextPage } = context;
  return (
    <div className="h-20 flex items-center justify-center">
      {isFetchingNextPage && (
        <div className="py-4 text-center text-sm font-medium text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
          Loading history...
        </div>
      )}
    </div>
  );
};

VirtuosoHeader.displayName = "VirtuosoHeader";
