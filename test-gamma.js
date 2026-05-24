async function test() {
  const url = 'https://gamma-api.polymarket.com/markets?condition_ids=0x416e3cbe25a60b8210f4e67c056ea2b03f4d511e7b969826d69ef90b753ff214';
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data[0], null, 2));
}
test();
