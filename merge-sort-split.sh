#!/bin/bash

#### This is untested as a shell script, I've only run these individually on the CLI.

### Sort all files by the 9th character (company record (1) or person record (2)); concat.
sort -k 1.9,1.9 Prod195_1754_ew_* > england-wales-sorted.dat
sort -k 1.9,1.9 Prod195_1754_ni* > northernireland-sorted.dat
sort -k 1.9,1.9 Prod195_1754_sc* > scotland-sorted.dat

### Split each monolith into companies and directors
awk '{fn=substr($0,9,1); print > fn}' england-wales-sorted.dat
mv 0 rubbish-england-wales.dat
mv 1 companies-england-wales.dat
mv 2 directors-england-wales.dat

awk '{fn=substr($0,9,1); print > fn}' northernireland-sorted.dat
mv 0 rubbish-northernireland.dat
mv 1 companies-northernireland.dat
mv 2 directors-northernireland.dat

awk '{fn=substr($0,9,1); print > fn}' scotland-sorted.dat
mv 0 rubbish-scotland.dat
mv 1 companies-scotland.dat
mv 2 directors-scotland.dat
