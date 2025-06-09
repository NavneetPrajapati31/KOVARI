import Skeleton from 'react-loading-skeleton';

interface User {
  name: string;
  email: string;
}

interface UserCardProps {
  user: User;
  loading: boolean;
}

const UserCard = ({ user, loading }: UserCardProps) => {
  if (loading) {
    return (
      <div className="p-4 shadow-md rounded-lg">
        <Skeleton height={20} width={`80%`} />
        <Skeleton height={15} width={`60%`} />
      </div>
    );
  }

  return (
    <div className="p-4 shadow-md rounded-lg">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
