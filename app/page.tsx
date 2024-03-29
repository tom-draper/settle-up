"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { useState } from "react";

function addPerson(people: Record<string, any>, setPeople: any) {
  const name = document.getElementById("name") as HTMLInputElement;
  if (name === null || name.value === "" || people[name.value] !== undefined) {
    return;
  }
  people[name.value] = { spent: 0, owes: {} };
  setPeople({ ...people });
  name.value = "";
}

function removePerson(
  name: string,
  people: Record<string, any>,
  setPeople: any
) {
  delete people[name];
  setPeople({ ...people });
}

function addPayment(
  i: number,
  expandedPayments: Set<number>,
  setExpandedPayments: any,
  payments: number,
  setPayments: any
) {
  // If this payment has already spawned a new payment entry, don't spawn another
  if (expandedPayments.has(i)) {
    return;
  }
  expandedPayments.add(i);
  setExpandedPayments(new Set(expandedPayments));
  setPayments(payments + 1);
}

function processPayments(payments: number, people: any, setPeople: any) {
  const result: People = Object.fromEntries(
    Object.keys(people).map((name) => [name, { spent: 0, owes: {} }])
  );

  console.log(payments)
  for (let i = 0; i < payments; i++) {
    const payeeContainer = document.getElementById(
      `payee-${i}`
    ) as HTMLInputElement;
    const amountContainer = document.getElementById(
      `amount-${i}`
    ) as HTMLInputElement;
    const debtorsContainer = document.getElementById(
      `debtors-${i}`
    ) as HTMLInputElement;

    if (
      payeeContainer === null ||
      amountContainer === null ||
      debtorsContainer === null
    ) {
      continue;
    }

    const payee =
      payeeContainer?.innerText === "Payee" ? "" : payeeContainer.innerText;
    if (payee === "" || !(payee in people)) {
      continue;
    }

    const amount =
      amountContainer.value === "" ? 0 : parseCurrency(amountContainer.value);
    if (amount === 0) {
      continue;
    }

    const debtors = Array.from(debtorsContainer.children)
      .map((debtor) => {
        if (debtor.children[0].getAttribute("aria-pressed") === "true") {
          //@ts-ignore
          return debtor.children[0].innerText;
        }
      })
      .filter((debtor) => debtor !== undefined);

    result[payee].spent += amount;
    for (const debtor of debtors) {
      if (debtor === undefined || debtor === payee || !(debtor in result)) {
        continue;
      }

      result[debtor].owes[payee] ||= 0;
      result[debtor].owes[payee] += amount / debtors.length;
    }
  }

  cancelPayments(result);

  setPeople(result);
}

function cancelPayments(people: People) {
  for (const name in people) {
    for (const owes in people[name].owes) {
      const debt = people[name].owes[owes];
      // If no debt exists the other way, leave debt untouched
      if (people[owes].owes[name] === undefined) {
        continue;
      }
      // If debt is greater than owed amount, eliminate the owed amount from the 
      // other person and subtract from the debt
      const owed = people[owes].owes[name];
      if (debt > owed) {
        people[name].owes[owes] -= owed;
        delete people[owes].owes[name];
      } else if (debt < owed) {
        people[owes].owes[name] -= debt;
        delete people[name].owes[owes];
      } else {
        delete people[name].owes[owes];
        delete people[owes].owes[name];
      }
    }
  }
}

function parseCurrency(value: string) {
  try {
    return parseFloat(value.replace(/[$£€]/, ""));
  } catch (e) {
    return 0;
  }
}

function formatCurrencyOnLeave(i: number, currency: string) {
  const amountEl = document.getElementById(`amount-${i}`) as HTMLInputElement;
  if (amountEl !== null && amountEl.value !== "") {
    updateWithFormattedCurrency(amountEl, currency);
  }
}

function updateWithFormattedCurrency(
  amountEl: HTMLInputElement,
  currency: string
) {
  let value = amountEl.value.replace(/[$£€]/g, "");
  try {
    value = parseFloat(value).toFixed(2);
    amountEl.value = formatCurrency(value, currency);
  } catch (e) {
    console.error(`Error parsing value: ${value}`, e);
  }
}

function reformatAllCurrencyInput(payments: number, currency: string) {
  for (let i = 0; i < payments; i++) {
    formatCurrencyOnLeave(i, currency);
  }
}

function formatCurrency(value: string, currency: string) {
  return `${currency != "€" ? currency : ""}${value}${
    currency != "€" ? "" : currency
  }`;
}

type People = {
  [name: string]: { spent: number; owes: { [name: string]: number } };
};

export default function Home() {
  const [currency, setCurrency] = useState("£");
  const [people, setPeople] = useState<People>({});
  const [payments, setPayments] = useState(1);
  const [expandedPayments, setExpandedPayments] = useState(new Set<number>());

  return (
    <div className="grid place-items-center">
      <div className="absolute right-4 top-4">
        <Select
          defaultValue="£"
          onValueChange={(e) => {
            setCurrency(e);
            reformatAllCurrencyInput(payments, e);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="£">£ Pound</SelectItem>
            <SelectItem value="$">$ Dollar</SelectItem>
            <SelectItem value="€">€ Euro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[50%] py-20 max-xl:w-[70%] max-lg:w-[80%] max-md:w-[90%]">
        <div className="flex">
          <Input
            placeholder="Add person..."
            id="name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addPerson(people, setPeople);
                // Wait for re-render to update the list of people before retrieving them from the DOM
                setTimeout(() => {
                  processPayments(payments, people, setPeople);
                }, 0);
              }
            }}
          />
          <Button
            variant="outline"
            className="ml-3"
            onClick={() => {
              addPerson(people, setPeople);
              // Wait for re-render to update the list of people before retrieving them from the DOM
              setTimeout(() => {
                processPayments(payments, people, setPeople);
              }, 0);
            }}
          >
            Submit
          </Button>
        </div>

        {Object.keys(people).length > 0 && (
          <div>
            <div className="mt-6 mb-10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right pr-6">Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(people).map((name, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium pl-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removePerson(name, people, setPeople);
                            processPayments(payments, people, setPeople);
                            if (Object.keys(people).length === 0) {
                              setPayments(1);
                            }
                          }}
                          className="px-2 hover:bg-[#dc2626]"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18 18 6M6 6l12 12"
                            />
                          </svg>
                        </Button>
                      </TableCell>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-right pr-6">
                        {formatCurrency(
                          people[name].spent.toFixed(2),
                          currency
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-b-[1px] py-8 max-sm:pt-0 max-sm:pb-6">
              {Array.from({ length: payments }).map((_, i) => (
                <div key={i} className="my-4">
                  <div className="flex">
                    <div className="flex max-sm:flex-col">
                      <div className="mt-5">
                        <Select
                          onValueChange={() => {
                            addPayment(
                              i,
                              expandedPayments,
                              setExpandedPayments,
                              payments,
                              setPayments
                            );
                            processPayments(payments, people, setPeople);
                          }}
                        >
                          <SelectTrigger className="w-[180px] max-sm:w-[100px]">
                            <SelectValue
                              placeholder={
                                <span className="text-muted-foreground">
                                  Payee
                                </span>
                              }
                              id={`payee-${i}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(people).map((name, i) => (
                              <SelectItem key={i} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mx-2 grid mt-5 max-sm:ml-0 max-sm:mt-2">
                        <Input
                          placeholder={formatCurrency("0.00", currency)}
                          className="w-24 max-sm:w-[100px]"
                          prefix="hello"
                          onChange={() => {
                            processPayments(payments, people, setPeople);
                          }}
                          onBlur={() => formatCurrencyOnLeave(i, currency)}
                          id={`amount-${i}`}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1 text-left text-muted-foreground">
                        Paid for...
                      </div>

                      <div
                        className="flex-grow flex text-center gap-2 flex-wrap"
                        id={`debtors-${i}`}
                      >
                        {Object.keys(people).map((name, i) => (
                          <div key={i}>
                            <Toggle
                              variant="outline"
                              aria-label="Name"
                              defaultPressed={true}
                              onPressedChange={() =>
                                processPayments(payments, people, setPeople)
                              }
                              className="data-[state=on]:bg-[#f97316] hover:bg-transparent"
                            >
                              {name}
                            </Toggle>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8">
          {Object.keys(people).length > 0 &&
            Object.entries(people).map(
              ([name, value], i) =>
                Object.keys(value.owes).length > 0 &&
                Object.values(value.owes).reduce((acc, a) => acc + a, 0) >
                  0 && (
                  <div key={i} className="my-2">
                    {name} owes
                    {Object.entries(value.owes).map(([name, amount], i) => (
                      <div key={i} className="ml-4 text-muted-foreground">
                        {name}: {formatCurrency(amount.toFixed(2), currency)}
                      </div>
                    ))}
                  </div>
                )
            )}
        </div>
      </div>
    </div>
  );
}
