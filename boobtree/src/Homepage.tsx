import { Link, Navigate } from "react-router";
import cryptoRandomString from "crypto-random-string";

export function Homepage() {
  return (
    <Link to="/newgame">Start a new game</Link>
  );
}

export function Start() {
  const id = cryptoRandomString({ length: 4, characters: 'CDEHKMPRTUWXY' });

  return <Navigate to={`/game/${id}`} replace />;
}