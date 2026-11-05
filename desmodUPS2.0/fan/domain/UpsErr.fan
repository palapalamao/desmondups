const class UpsErr : Err
{
  new make(Str code, Str message := "")
    : super(message.isEmpty ? code : "$code $message")
  {
    this.code = code
  }

  const Str code
}
