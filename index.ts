import { createCli } from './src/cli';

async function main(): Promise<void> {
  createCli()
    .parse(process.argv);
}

function runMain(): void {
  main()
    .then(() => {
    })
    .catch((error) => {
      console.error(error);
    });
}

runMain();
