import { useParams } from 'react-router-dom';
import { DealChat } from '../components/DealChat';

export function DealChatPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <DealChat
      listingId={id}
      backTo={`/browse-property/${id}`}
      backLabel="Back to listing"
    />
  );
}
