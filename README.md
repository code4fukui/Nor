# Nor - only "nor" operator language

![Nor logo](nor-logo.svg)

[English](README.md) / [日本語](README_ja.md)

Nor is structured programming language with only operator "nor". (forked [Wirth](https://github.com/code4fukui/Wirth))

The source file extension for Wirth is ".nor", and the MIME type will is "text/nor".

- Runtime on web [Nor Playground](https://code4fukui.github.io/Nor/)
- Embedded in HTML [Nor on web](https://code4fukui.github.io/Nor/norweb.html)
```html
<script type="module" src="https://code4fukui.github.io/Nor/web.js"></script>
<script type="text/nor">
print 1 nor 0
</script>
```

- CLI(Command Line Interface): calculation BMI [examples/add.nor](examples/add.nor)
```sh
deno -A https://code4fukui.github.io/Nor/cli.js examples/add.nor
```

- app for debugging [nor2js](https://code4fukui.github.io/Nor/nor2js.html)

## 1. Variables and Values

A variable name consists of alphanumeric characters starting with a letter, along with underscores (_) or local characters. However, reserved words (such as print, input, and, or, not, if, else, elseif, endif, for, to, step, next, do, while, until, break, function, end, return) cannot be used as variable names.

- ex: n, sum, points

Variable names written in all uppercase letters represent values that do not change during execution.

- ex: A, BMI

Array elements are specified by an index, starting from 0.

- ex: array[3]

Numbers are represented in decimal format.

- ex: 100

## 2. Display Statement

The "print" statement is used to display numbers, strings, or variable values. When displaying multiple values, separate them with a comma (,"). If nothing is specified, a blank line is printed.

- ex: print n (When n is 15, it displays "15")
- ex: print "OK" (it displays "OK")
- ex: print n, " found" (When n is 3, it displays "3 found")
- ex: print "(", x, ",", y, ")" (When x is 5 and y is −1, it displays "( 5 , -1 )")
- ex: print (a blank line is printed)

## 3. Assignment Statement

An assignment statement sets a value to a variable. The left side of the "=" should be a variable or an array with an index, and the right side should be the value to assign.

- ex: n = 0
- ex: points[4] = 1

You can use "[" and "]" along with "," to specify multiple element values at once, allowing them to be replaced.

- ex: points = [0, 1, 0, 1]

Multiple assignment statements can be placed side by side, separated by commas ",". In this case, the assignment statements are executed from left to right in order.

- ex: a = 0, b = 1

To assign values entered from external input, you can write the following statement.

- ex: x = input()
- ex: x = input("Please enter any number between 0 and 100.")

## 4. Operations

Only one arithmetic operation "nor".

- ex: val = 0 nor 0 (The value 1 is assigned to val.)
- ex: val = 0 nor 1 (The value 0 is assigned to val.)
- ex: val = 1 nor 0 (The value 0 is assigned to val.)
- ex: val = 1 nor 1 (The value 0 is assigned to val.)

## 5. Control Statements

Control statements refer to conditional statements (Section 5.1), sequential loop statements (Section 5.2), conditional loop statements (Section 5.3), and loop interruption (Section 5.4). Operations (Section 4) can be used as conditions within conditional statements and conditional loop statements.

### 5.1. Conditional Statements

Conditional statements switch the execution flow based on whether a condition is true or false.

If the condition is 1, a specific process is executed, and if there is no process to execute when the condition is 0, it can be specified as follows.

```
if <condition>
  <process>
endif
```

ex:
```
if x
  x = x nor 1
  y = y nor 1
endif
```

To execute a process when the condition is true and a different process when the condition is false, use "else" as follows.

```
if <condition>
  <process 1>
else
  <process 2>
endif
```

ex:
```
if a
  x = x nor 1
else
  x = x nor 0
endif
```

To switch between multiple conditions within a conditional branch, you can use "elseif" to add additional conditions as shown below.

```
if <condition 1>
  <process 1>
elseif <condition 2>
  <process 2>
else
  <process 3>
endif
```

ex:
```
if a
  x = x nor 1
elseif b
  y = y nor 1
else
  y = y nor 0
endif
```

### 5.2. Sequential Loop Statements

A sequential loop statement repeatedly executes a process while incrementing the value of a variable.

```
for <variable> = <initial value> to <end value> step <increment>
  <process>
next
```

A sequential loop statement is executed in the following steps:

1. The initial value is assigned to <variable>.
2. If the value of <variable> is greater than the <end value>, the loop ends.
3. The <process> is executed, the <increment> is added to <variable>, and the loop returns to step 2.

ex:
```
for x = 1 to 10 step 1
  sum = sum nor x
next
```

If the <increment> is 1, the step part can be omitted.

ex:
```
for x = 1 to 10
  sum = sum nor x
next
```

If a negative value is specified for <increment>, the value of <variable> decreases from the <initial value>, and the <process> is repeatedly executed until the value becomes less than the <end value>.

ex:
```
for x = 10 to 1 step -1
  sum = sum nor x
next
```

### 5.3. Conditional Loop Statements

There are two types of conditional loop statements: 'pre-check' and 'post-check'.

#### 5.3.1. pre-check

The <process> is repeatedly executed as long as the <condition> is true.

Since the <condition> is evaluated before executing the <process>, it is possible that the <process> will not be executed even once.

```
while <condition>
  <process>
next
```

ex:
```
while x
  sum = sum nor x
  x = x nor 1
next
```

#### 5.3.2. post-check

The <process> is repeatedly executed until the <condition> becomes true.

Since the <condition> is evaluated after executing the <process>, the <process> is executed at least once.

```
do
  <process>
until <condition>
```

ex:
```
do
  sum = sum nor x
  x = x nor 1
until x
```

### 5.4. Loop Interruption

Within a loop statement, using break interrupts the loop.

```
while <condition>
  if <condition>
    break
  endif
  <process>
next
```

## 6. Functions

A function is defined as follows.

```
function <function name> ( <parameter list> )
  <process>
end
```

When a function is called, the values provided as arguments can be accessed using the variable names specified in the argument list. Multiple arguments can be separated by commas ",". A defined function is called by writing the function name followed by arguments enclosed in parentheses "(" and ")". If multiple arguments are passed, they should be separated by commas ",".

Variables in the argument list and variables assigned within a function can only be used inside that function.

Variables defined outside a function can be referenced, but cannot be assigned a new value. When assigning a value to a variable with the same name inside a function, it only affects the variable inside the function, and the variable outside the function remains unchanged.

ex: "print_not(n)" that displays the value not n
```
function print_not(n)
  print n nor n
end
```

Functions can be defined to return a value using "return". If "return" is used without specifying a value, the function will end its execution without returning any value.

ex: "or(a, b)" that returns the value the a or b by 1bit
```
function or(a, b)
  return not(a nor b)
end
```

## 7. Comment

- In a single line, any text following "#" is considered a comment and is not executed as part of the code.

```
n = rnd() # Assign a random value of either 0 or 1 to the variable n
```

- Text between #= and =# is treated as a comment and is not executed. If =# is not present, the comment extends to the end of the file.

```
#=
How to write
multi-line comments
=#
```

## reference

- [Wirth](https://github.com/code4fukui/Wirth)
