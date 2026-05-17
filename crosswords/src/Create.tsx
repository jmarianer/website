import { PuzzleEditor } from "./PuzzleEditor";
import { database } from "./database";
import { push, ref } from "firebase/database";
import { useNavigate } from "react-router";

export function Create() {
  const navigate = useNavigate();

  return (
    <PuzzleEditor
      initialTemplate=""
      onSubmit={puzzle => {
        const newCrossword = push(ref(database, 'crosswords'), puzzle);
        navigate('/crossword/' + newCrossword.key);
      }}
    />
  );
}
