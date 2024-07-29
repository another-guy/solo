import { createCli } from './src/cli';

function runMain(): void {
  try {
    createCli()
      .parse(process.argv)
  } catch (error) {
    console.error(error);
  };
}

runMain();
