#!/usr/bin/env bats

setup() {
  cd "$BATS_TEST_DIRNAME/../.."
}

@test "two-loks.lok solves in 2 moves" {
  run npm run --silent cli -- src/cli/examples/two-loks.lok
  [ "$status" -eq 0 ]
  [[ "$output" == *"Solved in 2 move(s)"* ]]
}

@test "tlak-simple.lok solves in 1 TLAK move" {
  run npm run --silent cli -- src/cli/examples/tlak-simple.lok
  [ "$status" -eq 0 ]
  [[ "$output" == *"Solved in 1 move(s)"* ]]
  [[ "$output" == *"Move 1: TLAK"* ]]
}

@test "x-turn.lok solves in 1 LOK move" {
  run npm run --silent cli -- src/cli/examples/x-turn.lok
  [ "$status" -eq 0 ]
  [[ "$output" == *"Solved in 1 move(s)"* ]]
  [[ "$output" == *"Move 1: LOK"* ]]
}

@test "be-required.lok solves with BE followed by LOK" {
  run npm run --silent cli -- src/cli/examples/be-required.lok
  [ "$status" -eq 0 ]
  [[ "$output" == *"Solved in 2 move(s)"* ]]
  [[ "$output" == *"Move 1: BE"* ]]
  [[ "$output" == *"Move 2: LOK"* ]]
}

@test "larger.lok (real 7x11 puzzle) solves end-to-end" {
  run npm run --silent cli -- src/cli/examples/larger.lok
  [ "$status" -eq 0 ]
  [[ "$output" == *"Solved in"* ]]
}

@test "reads puzzle from stdin when no file argument given" {
  run bash -c 'printf "LOK*" | npm run --silent cli'
  [ "$status" -eq 0 ]
  [[ "$output" == *"Solved in 1 move(s)"* ]]
}

@test "unsolvable puzzle exits 2 and prints 'No solution'" {
  run bash -c 'printf "LOK*M" | npm run --silent cli'
  [ "$status" -eq 2 ]
  [[ "$output" == *"No solution"* ]]
}
