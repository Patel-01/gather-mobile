#pragma once
#include <memory>
#include <string>
#include <vector>
#include <GatherMobileSpecJSI.h>

namespace facebook::react {
class NativeEventSearch final : public NativeEventSearchCxxSpec<NativeEventSearch> {
 public:
  explicit NativeEventSearch(std::shared_ptr<CallInvoker> jsInvoker);
  std::vector<double> rankByTitle(jsi::Runtime& runtime, std::string query, std::vector<std::string> titles);
};
}
