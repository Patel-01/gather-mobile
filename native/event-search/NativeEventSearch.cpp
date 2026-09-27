#include "NativeEventSearch.h"
#include <algorithm>
#include <cctype>
#include <utility>

namespace facebook::react {
NativeEventSearch::NativeEventSearch(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeEventSearchCxxSpec(std::move(jsInvoker)) {}

std::vector<double> NativeEventSearch::rankByTitle(
    jsi::Runtime&, std::string query, std::vector<std::string> titles) {
  auto fold = [](std::string value) {
    std::transform(value.begin(), value.end(), value.begin(),
                   [](unsigned char character) { return static_cast<char>(std::tolower(character)); });
    return value;
  };
  query = fold(std::move(query));
  std::vector<std::pair<std::size_t, std::size_t>> matches;
  matches.reserve(titles.size());
  for (std::size_t index = 0; index < titles.size(); ++index) {
    const auto position = fold(std::move(titles[index])).find(query);
    if (position != std::string::npos) matches.emplace_back(position, index);
  }
  std::stable_sort(matches.begin(), matches.end(), [](const auto& left, const auto& right) {
    return left.first < right.first;
  });
  std::vector<double> result;
  result.reserve(matches.size());
  for (const auto& match : matches) result.push_back(static_cast<double>(match.second));
  return result;
}
}
