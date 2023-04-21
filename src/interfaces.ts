interface ColorVariants {
  primary: "blue";
  secondary: "red";
  tertiary: "green";
}

type PrimaryColor = ColorVariants["primary"];

type NonPrimaryColor = ColorVariants["secondary" | "tertiary"];

type EveryColor = ColorVariants[keyof ColorVariants];

type Letters = ["a", "b", "c"];

type AorB = Letters[0 | 1];
type letter = Letters[number];

interface UserRoleConfig {
  user: ["create", "view", "edit"];
  admin: ["create", "view", "edit", "delete", "ban"];
}

// A type that is a union of all the member values in the UserRoleConfig
type RoleAbility = UserRoleConfig[keyof UserRoleConfig][number];

enum Ability {
  create = "create",
  view = "view",
  edit = "edit",
  delete = "delete",
  ban = "ban",
  destroy = "destroy"
}

interface UserRoleConfigWithEnum {
  user: [Ability.create, Ability.view, Ability.edit];
  admin: [
    Ability.create,
    Ability.view,
    Ability.edit,
    Ability.delete,
    Ability.ban
  ];
}

type AbilityFromUserRoleConfig =
  UserRoleConfigWithEnum[keyof UserRoleConfigWithEnum][number];

////////////////
// ObjectKeys //
////////////////

const myObject = {
  a: 1,
  b: 2,
  c: 3
};

const objectKeys = <Obj>(obj: Obj) => Object.keys(obj) as (keyof Obj)[];

const myObjectKeys = objectKeys(myObject);
myObjectKeys.forEach((key) => {
  console.log(myObject[key]);
});

/////////////////////
// infer           //
// ConditionalType //
// Mapped Types    //
/////////////////////

interface ApiData {
  "maps:longitude": string; // want to strip "maps:" from the keys
  "maps:latitude": string;
}

type RemoveMaps<T> = T extends `maps:${infer U}` ? U : T;

type RemoveMapsFromObj<T> = {
  [K in keyof T as RemoveMaps<K>]: T[K];
};

type ApiDataWithoutMaps = RemoveMapsFromObj<ApiData>;

/////////////////////
// asserts         //
/////////////////////

class SDK {
  constructor(public loggedInUserId?: string) {}

  createPost(title: string) {
    this.assertUserIsLoggedIn();

    this._createPost(this.loggedInUserId, title);
  }

  _createPost(userId: string, title: string) {
    // ...
    console.log(`Created post for user ${userId} with title ${title}`);
  }

  // ‘asserts’ is a new keyword that can be used in a function signature to
  // indicate that the function will throw an exception if a certain condition
  // is not met.
  assertUserIsLoggedIn(): asserts this is this & {
    loggedInUserId: string;
  } {
    if (!this.loggedInUserId) {
      throw new Error("User is not logged in");
    }
  }
}

const sdk = new SDK("1234");
sdk.createPost("Hello World");

/////////////////////
// type from an object //
/////////////////////

const User = {
  id: "1231923810239",
  name: "Chris",
  age: 40
};

type UserKeys = keyof typeof User;

//////////////////////////
// function overloading //
//////////////////////////

function add(a?: string, b?: string): string;
function add(a: number, b: number): number;
function add(
  a: number | string | undefined,
  b: number | string | undefined
): number | string {
  if (typeof a === "number" && typeof b === "number") {
    return a + b;
  }

  return `${a}${b}`;
}

const x = add();

//////////////////////////
// Extend (mixins)      //
//////////////////////////

function extend<First, Second>(first: First, second: Second): First & Second {
  const result: Partial<First & Second> = {};
  // const result = {} as First & Second; // also works

  for (const prop in first) {
    if (first?.hasOwnProperty(prop)) {
      (result as First)[prop] = first[prop];
    }
  }

  for (const prop in second) {
    if (second?.hasOwnProperty(prop)) {
      (result as Second)[prop] = second[prop];
    }
  }

  return <First & Second>result;
}

class Person {
  constructor(public username: string) {}
}

interface Loggable {
  log(content: string): void;
}

class ConsoleLogger implements Loggable {
  log(content: string) {
    console.log(`Logger: ${content}`);
  }
}

const jim = extend(new Person("Jim"), new ConsoleLogger());
// const jim = extend(new Person("Jim"), ConsoleLogger.prototype); // also works
jim.log(jim.username);

//////////////////////////
// static properties    //
// Singleton            //
//////////////////////////

class Doggy {
  constructor(public readonly name: string, public readonly age: number) {}
}

const lilBub = new Doggy("Lil Bub", 7);

class DogList {
  // internal list store for this singleton.
  private dogs: Doggy[] = [];

  // The singleton instance of this class.
  static instance: DogList = new DogList();

  // Private constructor to prevent instantiation.
  private constructor() {}

  // Adds a dog to the list in the singleton.
  static addDog(name: string, age: number) {
    DogList.instance.dogs.push(new Doggy(name, age));
  }

  static getDogs(): Doggy[] {
    return DogList.instance.dogs;
  }
}

const lilBub2 = DogList.addDog("Lil Bub", 7);
console.log(DogList.getDogs());

//////////////////////////
// more typing examples //
//////////////////////////

type MyFlexibleDogInfo = {
  name: string;
  [key: string]: string | number; // similar to Record<string, string | number>
};

// same as above
type MyFlexibleDogInfo2 = {
  name: string;
} & Record<string, string | number>;

const dog: MyFlexibleDogInfo = {
  name: "Lil Bub",
  age: 7,
  breed: "American Shorthair"
};

interface DogInfo {
  name: string;
  age: number;
}

type OptionalFlags<T> = {
  [Property in keyof T]?: boolean;
};

type DogInfoOptional = OptionalFlags<DogInfo>;


//////////////////////////
// Implied Generics     //
//////////////////////////

interface Rank<RankItem> {
  item: RankItem;
  rank: number;
}

function ranker<RankItem>(
  items: RankItem[],
  rank: (item: RankItem) => number
): RankItem[] {
  const ranks: Rank<RankItem>[] = items.map((item) => ({
    item,
    rank: rank(item)
  }));

  ranks.sort((a, b) => b.rank - a.rank);

  return ranks.map((rank) => rank.item);
}

const dogBreeds = [
  { name: "Labrador", friendliness: 10 },
  { name: "Pug", friendliness: 3 }
  { name: "Poodle", friendliness: 8 },
  { name: "Pitbull", friendliness: 1 },
  { name: "Golden Retriever"}, // note: friendliness is undefined
];

const ranked = ranker(dogBreeds, (breed) => breed?.friendliness ?? 0);
console.log(ranked);

//////////////////////////
// Merge 2 objects      //
//////////////////////////

interface Dog_Base {
  name: string;
  age: number;
  [key: string]: string | number;
}

type Dog_Base_Alt = {
  name: string;
  age: number;
} & Record<string, string | number>;

interface Dog_Optionals {
  breed?: string;
  friendliness?: number;
  size?: string;
}

interface Dog_Overrides {
  name?: string;
  age?: number;
}

const merge1 = (dog: Dog_Base, options: Dog_Optionals): Dog_Base & Dog_Optionals => {
  return { ...dog, ...options };
}

const merge2 = (dog: Dog_Base, overrides: Dog_Overrides): Dog_Base & Dog_Overrides => {
  return { ...dog, ...overrides };
}